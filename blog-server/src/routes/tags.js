import Router from 'koa-router';
import jwt from 'jsonwebtoken';
import { createToken, checkToken } from '../utils/token';
import Pool from '../utils/db';

const tags = new Router();
const response = {
  data: {},
  success: true,
};

/**
 * 当请求进入tag时，记录相应信息，调用next()保证不直接返回而继续匹配路由
 */
tags.all('/', async (ctx, next) => {
  if (ctx.session.token) {
    try {
      const tokenObj = jwt.verify(ctx.session.token, 'geass_blog');
      const token = createToken(tokenObj.userId);
      ctx.session.token = token;
    } catch (e) {
      ctx.session.token = undefined;
    }
  }
  response.success = true;
  await next();
});

/**
 * 当请求为xxxxx/tags/page时，获得所有标签列表
 */
tags.get('/tags/page', async (ctx) => {
  const { pageSize = 100, current = 1 } = ctx.query;
  const rows = await Pool.query('SELECT * FROM tags limit ?, ?', [(current - 1) * pageSize, current * pageSize]);
  response.data = rows;
  ctx.body = response;
});

/**
 * 当请求为xxxxx/tags/:id时，获得对应
 */
tags.get('/tag/:id', async (ctx) => {
  const rows = await Pool.query('SELECT * FROM tags WHERE id = ?', [ctx.params.id]);
  response.data = rows;
  ctx.body = response;
});

/**
 * 创建新标签
 */
tags.post('/tag', checkToken, async (ctx) => {
  const {
    name, value,
  } = ctx.request.body;
  const rows = await Pool.query('INSERT INTO tags(name, value) VALUES (?, ?)', [name, value]);
  response.data = { insertId: rows.insertId };
  ctx.body = response;
});

/**
 * 更新标签
 */
tags.put('/tag', checkToken, async (ctx) => {
  const columns = ['name', 'value'];
  const { body } = ctx.request;
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
    const rows = await Pool.query('UPDATE tags SET ? WHERE id = ?', [updateObj, body.id]);
    response.data = { affectedRows: rows.affectedRows };
    ctx.body = response;
  }
});


/**
 * 删除标签
 */
tags.delete('/tag/:id', checkToken, async (ctx) => {
  const { id } = ctx.params;
  const rows = await Pool.query(
    'DELETE FROM tags WHERE id = ?',
    [id],
  );
  response.data = { affectedRows: rows.affectedRows };
  ctx.body = response;
});

export default tags;
