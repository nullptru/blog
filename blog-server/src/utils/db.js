import mysql from 'mysql';
import config from '../config';

const container = () => {
  let pool;

  const getPool = () => {
    return pool || mysql.createPool({
      connectionLimit: 10,
      host: config.dbHost,
      user: config.dbUser,
      password: config.dbPwd,
      database: config.dbName,
    });
  };
  return {
    query: (sql, params) => {
      return new Promise((resolve, reject) => {
        getPool().getConnection((err, connection) => {
          if (err) {
            reject(err);
          } else {
            const query = connection.query(sql, params, (errs, results) => {
              connection.release();
              if (errs) {
                reject(errs);
              }
              resolve(results);
            });
            console.log(query.sql);
          }
        });
      });
    },
    startTransaction: (querys) => {
      return new Promise((resolve, reject) => {
        getPool().getConnection((err, connection) => {
          if (err) {
            reject(err);
          } else { // get Connection
            connection.beginTransaction((transactionErr) => {
              if (transactionErr) {
                reject(err);
              } else {
                const resultArray = [];
                const len = querys.length;
                const exec = (i = 0) => {
                  const { sql, params } = querys[i];
                  let excuteParams = params;
                  // generate real params if params is function
                  if (typeof params === 'function') {
                    excuteParams = params(resultArray);
                  }
                  const query = connection.query(sql, excuteParams, (errs, results) => {
                    resultArray.push(results);
                    if (errs) {
                      return connection.rollback(() => {
                        reject(err);
                      });
                    }
                    if (typeof querys[i].cb === 'function') {
                      querys[i].cb(resultArray);
                    }
                    if (i === len - 1) { // last query
                      connection.commit((commitErr) => {
                        if (err) {
                          return connection.rollback(() => {
                            reject(commitErr);
                          });
                        }
                        resolve(resultArray);
                      });
                    } else {
                      exec(i + 1);
                    }
                  });
                  console.log(query.sql);
                };
                exec(0);
              }
            });
          }
        });
      });
    },
    getPool,
  };
};

export default container();