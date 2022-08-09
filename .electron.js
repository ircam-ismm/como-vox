const pkg = require('./package.json');

const config = {
  // do not touch these ones
  buildVersion: pkg.version,
  name: pkg.name,
  author: 'Ircam ISMM',
  // product infos
  productName: 'CoMo Vox',
  appId: 'fr.ircam.ismm.como-vox',
  icon: './media/icon.png',
  publish: {
    provider: 'github',
    owner: 'ircam-ismm',
    repo: 'como-vox',
  },
  // list of files or directories that we don't want to include in the binary
  // by default the whole application except the .git directory is copied
  exclude: [
    'dns',
    'certificates',
    'max-include',
    'media',
    'python',
    'tests',
    'tests-gui',
    'logs',
    'update-certs.sh',
  ]
}

module.exports = config;
