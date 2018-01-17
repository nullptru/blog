import Router from 'koa-router';
import qiniu from 'qiniu';
import fs from 'fs';
import Pool from '../utils/db';
import upload from '../utils/upload';
import ip from '../utils/ip';
import { dateFormat } from '../utils/index';
import Config from '../config';

const articles = new Router();
const response = {
  data: {},
  success: true,
};

const getTags = (tagStr) => {
  if (!tagStr) return []; // return empty array if tagStr is '' or undefined
  const arr = tagStr.split('|');
  const res = [];
  for (let i = 0; i < arr.length; i += 1) {
    const t = arr[i].split(',');
    if (t.length) {
      res.push({
        id: t[0] || '',
        name: t[1] || '',
        value: t[2] || '',
      });
    }
  }
  return res;
};

/**
 * 当请求进入article时，记录相应信息，调用next()保证不直接返回而继续匹配路由
 */
articles.all('/', async (ctx, next) => {
  response.success = true;
  await next();
});

/**
 * 当请求为/articles/page时，获得所有文章列表 status = 1
 */
articles.get('/articles/page', async (ctx) => {
  const { pageSize = 10, current = 1, search = '' } = ctx.query;
  const searchStr = `%${search}%`;
  const rows = await Pool.query(
    'SELECT (SELECT count(*) FROM articles WHERE content LIKE ? OR title LIKE ? OR abstraction LIKE ? ) AS total, articles.id, articles.title, articles.created_time, articles.abstraction, articles.image_url, ' +
    "GROUP_CONCAT(concat_ws(',', tags.id, tags.name,tags.value) ORDER BY tags.id SEPARATOR '|') AS articleTags  FROM articles " +
    'LEFT JOIN tag2article ON tag2article.article_id = articles.id ' +
    'LEFT JOIN tags ON tag2article.tag_id = tags.id ' +
    'WHERE (content LIKE ? OR title LIKE ? OR abstraction LIKE ?) AND status=1 ' +
    'GROUP BY articles.id ' +
    'LIMIT ?, ?',
    [searchStr, searchStr, searchStr, searchStr, searchStr, searchStr, (current - 1) * pageSize, current * pageSize],
  );
  const data = Array.from(rows);
  // pagination
  response.total = data[0] !== undefined ? (data[0].total || 0) : 0;
  response.pageSize = pageSize;
  response.current = current;
  const resData = data.map((item) => {
    const newItem = { ...item };
    newItem.tags = getTags(newItem.articleTags);
    newItem.createdTime = dateFormat(newItem.created_time, 'yyyy-MM-dd');
    newItem.imageUrl = newItem.image_url;
    delete newItem.articleTags;
    delete newItem.total;
    delete newItem.created_time;
    delete newItem.image_url;
    return newItem;
  });
  response.data = resData;
  ctx.body = response;
});

/**
 * 当请求为/articles/all 时，获得所有文章列表
 */
articles.get('/articles/all', async (ctx) => {
  const rows = await Pool.query('SELECT articles.id, articles.title, articles.created_time, articles.abstraction, articles.image_url, ' +
    "GROUP_CONCAT(concat_ws(',', tags.id, tags.name,tags.value) ORDER BY tags.id SEPARATOR '|') AS articleTags  FROM articles " +
    'LEFT JOIN tag2article ON tag2article.article_id = articles.id ' +
    'LEFT JOIN tags ON tag2article.tag_id = tags.id ' +
    'GROUP BY articles.id ', []);
  const data = Array.from(rows);
  const resData = data.map((item) => {
    const newItem = { ...item };
    newItem.tags = getTags(newItem.articleTags);
    newItem.createdTime = dateFormat(newItem.created_time, 'yyyy-MM-dd');
    delete newItem.articleTags;
    delete newItem.total;
    delete newItem.created_time;
    return newItem;
  });
  response.data = resData;
  ctx.body = response;
});


/**
 * 当请求为/articles/tags时，获得所有标签下的文章列表
 */
articles.get('/articles/tags', async (ctx) => {
  const tagsArticles = {};
  const rows = await Pool.query(
    'SELECT articles.id, articles.title, articles.created_time, articles.abstraction, ' +
    "GROUP_CONCAT(concat_ws(',', tags.id, tags.name,tags.value) ORDER BY tags.id SEPARATOR '|') AS articleTags  FROM articles " +
    'LEFT JOIN tag2article ON tag2article.article_id = articles.id ' +
    'LEFT JOIN tags ON tag2article.tag_id = tags.id ' +
    'WHERE status=1 ' +
    'GROUP BY articles.id ',
    [],
  );
  const data = Array.from(rows);
  // get all tags
  const tagRows = await Pool.query('SELECT * FROM tags', []);
  const tagsArray = Array.from(tagRows);
  tagsArray.forEach((tag) => {
    tagsArticles[tag.value] = [];
  });

  data.forEach((item) => {
    const newItem = { ...item };
    newItem.tags = getTags(newItem.articleTags);
    newItem.createdTime = dateFormat(newItem.created_time, 'yyyy-MM-dd');
    delete newItem.articleTags;
    delete newItem.created_time;
    newItem.tags.forEach((tag) => {
      tagsArticles[tag.value].push(newItem);
    });
  });
  response.data = tagsArticles;
  ctx.body = response;
});

/**
 * 当请求为/articles/:id时，获得对应id文章
 */
articles.get('/article/:id', async (ctx) => {
  const ipAddress = ip.address();
  const isNew = ip.addCached(ctx.req.socket.remoteAddress || ipAddress);
  console.log(ctx.req.socket.remoteAddress, ctx.req.socket.remoteFamily, ctx.req.socket.remotePort);
  const querys = [{
    sql: "SELECT articles.*, GROUP_CONCAT(concat_ws(',', tags.id, tags.name,tags.value) ORDER BY tags.id SEPARATOR '|') AS articleTags  FROM articles " +
    'LEFT JOIN tag2article ON tag2article.article_id = articles.id ' +
    'LEFT JOIN tags ON tag2article.tag_id = tags.id ' +
    'WHERE articles.id = ? AND status = 1 ' +
    'GROUP BY articles.id',
    params: [ctx.params.id],
  }, { // 上一篇
    sql: 'SELECT id, title FROM articles WHERE id = ( SELECT max( id ) FROM articles WHERE id < ? AND status = 1)',
    params: [ctx.params.id],
  }, { // 下一篇
    sql: 'SELECT id, title FROM articles WHERE id = ( SELECT min( id ) FROM articles WHERE id > ? AND status = 1)',
    params: [ctx.params.id],
  }];
  if (isNew) {
    querys.unshift({
      sql: 'UPDATE articles SET visited_count = visited_count + 1 WHERE id = ?',
      params: [ctx.params.id],
    });
  }
  const rows = await Pool.startTransaction(querys);
  const data = Array.from(rows[isNew ? 1 : 0]);
  const resData = data.map((item) => {
    const newItem = { ...item };
    newItem.tags = getTags(newItem.articleTags);
    newItem.visitedCount = newItem.visited_count;
    newItem.imageUrl = newItem.image_url;
    delete newItem.articleTags;
    delete newItem.visited_count;
    delete newItem.image_url;
    return newItem;
  });
  [response.data] = resData;
  [, [response.data.pre], [response.data.next]] = rows;
  // 转义
  response.data.content = response.data.content.replace(/\\n/g, '\n');
  response.data.createdTime = dateFormat(response.data.created_time, 'yyyy-MM-dd');
  delete response.data.created_time;
  ctx.body = response;
});

/**
 * 当请求为/articles/tags/:tag/page时，获得相应tag下的文章列表
 */
articles.get('/articles/tags/:tag/page', async (ctx) => {
  const { pageSize = 10, current = 1 } = ctx.query;
  const rows = await Pool.query(
    'SELECT (SELECT count(*) FROM articles, tag2article, tags WHERE tag2article.tag_id = tags.id AND tag2article.article_id = articles.id AND tags.value = ?) AS total, articles.id, articles.title, articles.created_time, articles.abstraction, articles.image_url, ' +
    "GROUP_CONCAT(concat_ws(',', tags.id, tags.name,tags.value) ORDER BY tags.id SEPARATOR '|') AS articleTags  FROM articles " +
    'LEFT JOIN tag2article ON tag2article.article_id = articles.id ' +
    'LEFT JOIN tags ON tag2article.tag_id = tags.id ' +
    'WHERE articles.id IN ( SELECT articles.id FROM articles, tag2article, tags WHERE tag2article.tag_id = tags.id AND tag2article.article_id = articles.id AND tags.value = ? AND status=1 ) ' +
    'GROUP BY articles.id ' +
    'LIMIT ?, ?',
    [ctx.params.tag, ctx.params.tag, (current - 1) * pageSize, current * pageSize],
  );
  const data = Array.from(rows);
  // pagination
  response.total = data[0] !== undefined ? (data[0].total || 0) : 0;
  response.pageSize = pageSize;
  response.current = current;
  const resData = data.map((item) => {
    const newItem = { ...item };
    newItem.tags = getTags(newItem.articleTags);
    newItem.createdTime = dateFormat(newItem.created_time, 'yyyy-MM-dd');
    delete newItem.articleTags;
    delete newItem.total;
    delete newItem.created_time;
    return newItem;
  });
  response.data = resData;
  ctx.body = response;
});

/**
 * 获取最新的文章信息
 * ps:只返回名称和id
 */
articles.get('/articles/latest', async (ctx) => {
  const { pageSize = 10 } = ctx.query;
  const rows = await Pool.query('SELECT id, title FROM articles WHERE status=1 ORDER BY created_time limit 0, ?', [pageSize]);
  response.data = rows;
  ctx.body = response;
});

/**
 * 上传图片
 */
articles.post('/article/image/upload', upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 10 },
]), async (ctx) => {
  const result = [];
  const files = ctx.req.files.avatar === undefined ? ctx.req.files.gallery : ctx.req.files.avatar;
  for (const file of files) {
    response.data = { filename: file.path };

    result.push((async () => {
      const res = await uploadToQiniu(file.path, file.originalname);
      res.filename = Config.defaultDomain + res.key;
      await deleteTmpFile(file.path);
      return res;
    })(file));
  }
  const resData = await Promise.all(result);
  response.data = resData.length === 1 ? resData[0] : resData;
  ctx.body = response;
});

const uploadToQiniu = (filepath, key) => {
  // upload to qiniu
  const mac = new qiniu.auth.digest.Mac(Config.accessKey, Config.secretKey);
  const putPolicy = new qiniu.rs.PutPolicy(Config.uploadConfig);
  const uploadToken = putPolicy.uploadToken(mac);
  const config = new qiniu.conf.Config();
  // 空间对应的机房
  config.zone = qiniu.zone.Zone_z0;
  const formUploader = new qiniu.form_up.FormUploader(config);
  const putExtra = new qiniu.form_up.PutExtra();
  return new Promise((resolved, reject) => {
    formUploader.putFile(uploadToken, key, filepath, putExtra, (respErr, respBody, respInfo) => {
      if (respErr) {
        reject(respErr);
      }
      if (respInfo.statusCode === 200) {
        resolved(respBody);
      } else {
        resolved(respBody);
      }
    });
  });
};

const deleteTmpFile = (filepath) => {
  const isExist = fs.existsSync(filepath);
  if (isExist) {
    return fs.unlinkSync(filepath);
  }
  return false;
};

/**
 * 创建新文章
 */
articles.post('/article', async (ctx) => {
  const {
    title, content, abstraction, author, imageUrl = '', tagIds = [], status,
  } = ctx.request.body;
  /**
   * insert a article by 2 step
   * 1. insert a new article link to the previous article
   * 2. insert article's tags infomation into table named tag2article
   */
  const querys = [{
    sql: 'INSERT INTO articles(id, title, content, author, abstraction, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    params: [new Date().getTime(), title, content, author, abstraction, imageUrl, status],
  }];
  if (tagIds.length > 0) {
    querys.push({
      sql: 'INSERT INTO tag2article(article_id, tag_id) VALUES ?',
      params: (results) => {
        const { insertId } = results[0];
        const params = tagIds.map(tagId => [insertId, tagId]);
        return [params];
      },
    });
  }
  querys.push({
    sql: "SELECT articles.*, GROUP_CONCAT(concat_ws(',', tags.id, tags.name,tags.value) ORDER BY tags.id SEPARATOR '|') AS articleTags  FROM articles " +
    'LEFT JOIN tag2article ON tag2article.article_id = articles.id ' +
    'LEFT JOIN tags ON tag2article.tag_id = tags.id ' +
    'WHERE articles.id = ? ' +
    'GROUP BY articles.id',
    params: (results) => {
      const { insertId } = results[0];
      return [insertId];
    },
  });
  const rows = await Pool.startTransaction(querys);
  const resData = rows[querys.length - 1].map((item) => {
    const newItem = { ...item };
    newItem.tags = getTags(newItem.articleTags);
    delete newItem.articleTags;
    return newItem;
  });
  [response.data] = resData;
  ctx.body = response;
});


/**
 * 更新文章
 */
articles.put('/article', async (ctx) => {
  const columns = ['title', 'content', 'abstraction', 'image_url'];
  const { body } = ctx.request;
  const { tagIds = [] } = body;
  const updateObj = {};
  let updated = false;
  columns.forEach((column) => {
    if (body[column] !== undefined && body[column] !== null) { // if column has value
      updated = true;
      updateObj[column] = body[column];
    }
  });
  if (!updated) {
    response.data = {};
    response.success = false;
    response.err = '未发现需更新字段';
    ctx.body = response;
    ctx.throw(400, 'Error Message');
  } else {
    let querys = [{
      sql: 'UPDATE articles SET ? WHERE id = ?',
      params: [updateObj, body.id],
    }];
    if (tagIds.length > 0) {
      const params = tagIds.map(tagId => [body.id, tagId]);
      querys = querys.concat([{
        sql: 'DELETE FROM tag2article WHERE article_id = ?',
        params: [body.id],
      }, {
        sql: 'INSERT INTO tag2article(article_id, tag_id) VALUES ?',
        params: [params],
      }]);
    }
    querys.push({
      sql: "SELECT articles.*, GROUP_CONCAT(concat_ws(',', tags.id, tags.name,tags.value) ORDER BY tags.id SEPARATOR '|') AS articleTags  FROM articles " +
      'LEFT JOIN tag2article ON tag2article.article_id = articles.id ' +
      'LEFT JOIN tags ON tag2article.tag_id = tags.id ' +
      'WHERE articles.id = ?  AND status=1 ' +
      'GROUP BY articles.id',
      params: [body.id],
    });
    const rows = await Pool.startTransaction(querys);
    const resData = rows[querys.length - 1].map((item) => {
      const newItem = { ...item };
      newItem.tags = getTags(newItem.articleTags);
      delete newItem.articleTags;
      return newItem;
    });
    [response.data] = resData;
    ctx.body = response;
  }
});

/**
 * 删除文章
 */
articles.del('/article/:id', async (ctx) => {
  const { id } = ctx.params;
  const rows = await Pool.query(
    'DELETE FROM articles WHERE id = ?',
    [id],
  );
  response.data = { affectedRows: rows.affectedRows };
  if (response.data.affectedRows === 0) {
    response.success = false;
    response.err = '未找到需删除数据';
    ctx.status = 400;
  }
  ctx.body = response;
});

export default articles;
