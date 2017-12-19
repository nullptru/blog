import React from 'react';
import ReactMarkdown from 'react-markdown';
import CodeMirrorEditor from 'components/CodeMirrorEditor';
import HighLight from 'components/HighLight';
import Sider from 'components/layout/Sider';
import Select, { Option } from 'rc-select';
import { createForm } from 'rc-form';
import Upload from 'rc-upload';
import 'themes/index.less';
import 'rc-select/assets/index.css';
import Input from 'components/Input';
import styles from './index.less';

class AdminIndex extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      editorText: '# Heading\n\nSome **bold** and _italic_ text\nBy [Jed Watson](https://github.com/JedWatson)',
    };
    this.uploaderProps = {
      data: { a: 1, b: 2 },
      beforeUpload(file) {
        console.log('beforeUpload', file.name);
      },
      onStart: (file) => {
        console.log('onStart', file.name);
        // this.refs.inner.abort(file);
      },
      onSuccess(file) {
        console.log('onSuccess', file);
      },
      onError(err) {
        console.log('onError', err);
      },
      customRequest(...args) {
        const newPromise = new Promise((resolve, reject) => {
          setTimeout(resolve('succes'), 200);
        });
        newPromise.then(value => console.log(value, args));
      },
    };
    this.onEditorChange = this.onEditorChange.bind(this);
  }

  onEditorChange = text => this.setState({ editorText: text });

  onSubmit = () => {
    const { getFieldsValue } = this.props.form;
    console.log(getFieldsValue());
  }

  getFieldDecorator = (name) => {
    const { getFieldDecorator } = this.props.form;
    return (child) => {
      const input = React.cloneElement(child, { id: name, className: 'col-md-2' });
      return (<div className="row margin-base">
        <label htmlFor={name} className="col-md-1" >{name}:</label>
        {getFieldDecorator(name)(input)}
      </div>);
    };
  }

  render() {
    const props = {
      mode: 'markdown',
      theme: 'monokai',
      onChange: this.onEditorChange,
      value: this.state.editorText,
    };
    const { getFieldDecorator } = this.props.form;
    const items = [
      { title: 'test', key: '/' },
      { title: 'test2', key: '/test' },
    ];
    return (
      <div className={styles.container}>
        <Sider items={items} />
        <div className={styles.markdownArticlePanel}>
          <form>
            <div className={styles.articlePanel}>
              {getFieldDecorator('title')(<Input className={styles.title} />)}
              <div className={styles.toolPanel}>
                <Upload {...this.uploaderProps} className={styles.upload}><button type="button">上传图片</button></Upload>
                {getFieldDecorator('tags')(<Select multiple>
                  <Option value="a" key="a">a</Option>
                  <Option value="b" key="b">b</Option>
                  <Option value="c" key="c">c</Option>
                </Select>)}
                <button type="button" onClick={this.onSubmit}>提交</button>
              </div>
              {getFieldDecorator('abstraction')(<Input className={styles.abstraction} multiple />)}
              <div className={styles.codePanel}>
                <CodeMirrorEditor {...props} />

                <HighLight className={styles.markdownContainer}>
                  <ReactMarkdown source={this.state.editorText} escapeHtml={false} />
                </HighLight>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

export default createForm()(AdminIndex);
