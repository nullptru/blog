import default from "dva";

const articles = [{
  id: '111',
  type: {
    label: '充电站',
    value: 'charging',
  },
  createdTime: '2017-08-31',
  title: '这是一篇文章标题哦这是一篇文',
  content: '这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文',
  abstraction: '如果你无法简洁的表达你的想法，那只说明你还不够了解它。好きな気持ちはどうしても隠しできません〜好きで好きでたまらない〜 -- 阿尔伯特·爱因斯坦',
  tags: [
    {
      label: 'javascript',
      value: 'Javascript',
    },
  ],
  image_url: '#',
  pre: null,
  next: '222',
}, {
  id: '222',
  type: {
    label: '充电站',
    value: 'charging',
  },
  createdTime: '2017-08-31',
  title: '这是一篇文章标题哦这是一篇文2',
  content: '这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文',
  abstraction: '如果你无法简洁的表达你的想法，那只说明你还不够了解它。好きな気持ちはどうしても隠しできません〜好きで好きでたまらない〜 -- 阿尔伯特·爱因斯坦',
  tags: [
    {
      label: 'javascript',
      value: 'Javascript',
    },
  ],
  image_url: '#',
  pre: '111',
  next: '333',
}, {
  id: '333',
  type: {
    label: '充电站',
    value: 'charging',
  },
  createdTime: '2017-08-31',
  title: '这是一篇文章标题哦这是一篇文',
  content: '这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文',
  abstraction: '如果你无法简洁的表达你的想法，那只说明你还不够了解它。好きな気持ちはどうしても隠しできません〜好きで好きでたまらない〜 -- 阿尔伯特·爱因斯坦',
  tags: [
    {
      label: '心情',
      value: 'emotion',
    },
  ],
  image_url: '#',
  pre: '222',
  next: '444',
}, {
  id: '444',
  type: {
    label: '充电站',
    value: 'charging',
  },
  createdTime: '2017-08-31',
  title: '这是一篇文章标题哦这是一篇文',
  content: '这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文',
  abstraction: '如果你无法简洁的表达你的想法，那只说明你还不够了解它。好きな気持ちはどうしても隠しできません〜好きで好きでたまらない〜 -- 阿尔伯特·爱因斯坦',
  tags: [
    {
      label: '心情',
      value: 'emotion',
    },
  ],
  image_url: '#',
  pre: '333',
}];

const storeActicles = [{
  id: '233',
  type: {
    label: '储藏室',
    value: 'storeroom',
  },
  createdTime: '2017-08-31',
  title: '这是一篇文章标题哦这是一篇文',
  content: '这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文',
  abstraction: '如果你无法简洁的表达你的想法，那只说明你还不够了解它。好きな気持ちはどうしても隠しできません〜好きで好きでたまらない〜 -- 阿尔伯特·爱因斯坦',
  tags: [
    {
      label: '心情',
      value: 'emotion',
    },
  ],
  image_url: '#',
  pre: null,
  next: '234',
}, {
  id: '234',
  type: {
    label: '储藏室',
    value: 'storeroom',
  },
  createdTime: '2017-08-31',
  title: '这是一篇文章标题哦这是一篇文',
  content: '这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文',
  abstraction: '如果你无法简洁的表达你的想法，那只说明你还不够了解它。好きな気持ちはどうしても隠しできません〜好きで好きでたまらない〜 -- 阿尔伯特·爱因斯坦',
  tags: [
    {
      label: '心情',
      value: 'emotion',
    },
  ],
  image_url: '#',
  pre: 233,
  next: '235',
}, {
  id: '235',
  type: {
    label: '储藏室',
    value: 'storeroom',
  },
  createdTime: '2017-08-31',
  title: '这是一篇文章标题哦这是一篇文',
  content: '这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文',
  abstraction: '如果你无法简洁的表达你的想法，那只说明你还不够了解它。好きな気持ちはどうしても隠しできません〜好きで好きでたまらない〜 -- 阿尔伯特·爱因斯坦',
  tags: [
    {
      label: '心情',
      value: 'emotion',
    },
  ],
  image_url: '#',
  pre: 234,
  next: '',
}];

const motionActicles = [{
  id: '223',
  type: {
    label: '储藏室',
    value: 'storeroom',
  },
  createdTime: '2017-08-31',
  title: '这是一篇文章标题哦这是一篇文',
  content: '这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文这是一篇文章标题哦这是一篇文',
  abstraction: '如果你无法简洁的表达你的想法，那只说明你还不够了解它。好きな気持ちはどうしても隠しできません〜好きで好きでたまらない〜 -- 阿尔伯特·爱因斯坦',
  tags: [
    {
      label: '心情',
      value: 'emotion',
    },
  ],
  image_url: '#',
}];

export default {
  chargings: articles,
  storerooms: storeActicles,
  motions: motionActicles,
};

