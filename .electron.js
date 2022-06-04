const pkg = require('./package.json');

const config = {
  // avoid spaces in product name, this crashes the build process
  productName: 'CoMo Vox',
  buildVersion: pkg.version,
  appId: 'fr.ircam.ismm.como-vox',
  icon: './media/icon.png',
  publish: [
    {
      provider: 'github',
      owner: 'ircam-ismm',
      reop: 'como-vox',
    }
  ],
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
