const e = {};

export function getTimeSignature (event) {
  const parentElement = event.srcElement.parentElement;
  const count = parseFloat(parentElement.querySelector('.count').value) || 4;
  const division = parseFloat(parentElement.querySelector('.division').value) || 4;
  return {count, division};
}
Object.assign(e, {getTimeSignature});

export function getBarBeat (event) {
  const parentElement = event.srcElement.parentElement;
  const bar = parseFloat(parentElement.querySelector('.bar').value) || 0;
  const beat = parseFloat(parentElement.querySelector('.beat').value) || 0;
  return {bar, beat};
}
Object.assign(e, {getBarBeat});

export function getPosition (event) {
  const parentElement = event.srcElement.parentElement;
  let bar = parseFloat(parentElement.querySelector('.bar').value) || 1;
  if(bar <= 0) {
    bar += 1;
  }
  const beatElement = parentElement.querySelector('.beat');
  const beat = (beatElement && parseFloat(beatElement.value) ) || 1;
  return {bar, beat};
}
Object.assign(e, {getPosition});

export function selfSelect(event) {
  const element = event.srcElement;
  try {
    // mainly for mobile
    element.setSelectionRange(0, element.value.length);
  } catch (error) {
    try {
      element.select();
    } catch(error) {
      // forget it
    }
  }
}
Object.assign(e, {selfSelect});

export default e;
