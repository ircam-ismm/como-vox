import 'regenerator-runtime/runtime';
import 'source-map-support/register';
import { Server } from '@soundworks/core/server';
import CoMo from 'como/server';
import path from 'path';
import fs from 'fs';
import util from 'util'; // for promisify, since node v8
import serveStatic from 'serve-static';
import compile from 'template-literal';
import JSON5 from 'json5';

import CoMoExperience from './CoMoExperience';

import voxPlayerSchema from './schemas/voxPlayer';
import voxApplicationSchema from './schemas/voxApplication';

import getConfig from './utils/getConfig.js';

import './imports.js';

const ENV = process.env.ENV || 'default';
const config = getConfig(ENV);

// get CoMo specific config
try {
  let comoConfigPath = path.join('config', 'como.json');
  // if a config file specific to the environment exists
  // it take precedence over the default one.
  // (usefull for launching several apps from the same source)
  const comoEnvConfigPath = path.join('config', `como-${ENV}.json`);
  if (fs.existsSync(comoEnvConfigPath)) {
    comoConfigPath = comoEnvConfigPath;
  }

  config.como = JSON5.parse(fs.readFileSync(comoConfigPath, 'utf-8'));
} catch(err) {
  console.log(err);
  console.log(`Invalid "como.json" config file`);
  process.exit(0);
}

const projectsDirectory = path.join(process.cwd(), 'projects');
const projectName = config.como.project;

const server = new Server();

// html template and static files (in most case, this should not be modified)
server.templateEngine = { compile };
server.templateDirectory = path.join('.build', 'server', 'tmpl');

// if (config.env.auth) {
//   server.router.use((req, res, next) => {

//     const isProtected  = config.env.auth.clients
//       .map(type => req.path.endsWith(`/${type}`))
//       .reduce((acc, value) => acc || value, false);

//     if (isProtected) {
//       // authentication middleware
//       const auth = config.env.auth;
//       // parse login and password from headers
//       const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
//       const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

//       // verify login and password are set and correct
//       if (login && password && login === auth.login && password === auth.password) {
//         // -> access granted...
//         return next()
//       }

//       // -> access denied...
//       res.writeHead(401, {
//         'WWW-Authenticate':'Basic',
//         'Content-Type':'text/plain'
//       });
//       res.end('Authentication required.')
//     } else {
//       // route not protected
//       return next();
//     }
//   });
// }

server.router.use(serveStatic('public'));
server.router.use('build', serveStatic(path.join('.build', 'public')));
server.router.use('vendors', serveStatic(path.join('.vendors', 'public')));
server.router.use(serveStatic('assets'));

console.log(`
--------------------------------------------------------
- launching "${config.app.name}" in "${ENV}" environment
- [pid: ${process.pid}]
--------------------------------------------------------
`);

const como = new CoMo(server, projectsDirectory, projectName);

(async function launch() {
  try {
    // @todo - check how this behaves with a node client...
    await server.init(config, (clientType, config, httpRequest) => {
      return {
        clientType: clientType,
        app: {
          name: config.app.name,
          author: config.app.author,
        },
        env: {
          type: config.env.type,
          websockets: config.env.websockets,
          assetsDomain: config.env.assetsDomain,
        }
      };
    });
    await como.init();

    const experience = new CoMoExperience(como);

    // start all the things
    await server.start();
    await como.start();

    // util since node v8
    // fs.promises since node v11
    const scoresPath = 'scores';
    const scores = await util.promisify(fs.readdir)(path.join('assets', scoresPath) )
          .then( (files) => {
            return files.filter( (file) => {
              const extension = path.extname(file).toLowerCase();
              return (extension === '.mid' || extension === '.midi');
            });
          });

    server.stateManager.registerSchema('vox-application', voxApplicationSchema);
    const voxApplicationState = await server.stateManager.create('vox-application');
    voxApplicationState.set({
      scoresPath,
      scores,
    });

    server.stateManager.registerSchema('vox-player', voxPlayerSchema);

  } catch (err) {
    console.error(err.stack);
  }
})();

process.on('unhandledRejection', (reason, p) => {
  console.log('> Unhandled Promise Rejection');
  console.log(reason);
});
