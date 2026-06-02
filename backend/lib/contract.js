let contractModule = null;

async function getContract() {
  if (!contractModule) {
    contractModule = await import('@pdf-editor/contract');
  }
  return contractModule;
}

module.exports = { getContract };
