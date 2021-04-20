const e = {};

export function conformValue(schema, key, value) {
  const valueParsed = (typeof value === 'string'
                       && schema[key].type !== 'string'
                       ? JSON.parse(value)
                       : value);
  switch(schema[key].type) {
    case 'boolean': {
      return (valueParsed ? true : false);
      break;
    }

    default: {
      return valueParsed;
      break;
    }

  }

}
Object.assign(e, {conformValue});

export function getDefaultValue(schema, key) {
  const entry = schema[key];
  return entry.default;
}
Object.assign(e, {getDefaultValue});

export function isEvent(schema, key) {
  const entry = schema[key];
  return (typeof entry.event !== 'undefined'
          ? entry.event
          : false);
}
Object.assign(e, {isEvent});

export function isExported(schema, key) {
  const entry = schema[key];
  // event is not exported by default
  const event = isEvent(schema, key);
  // export by default if not event
  const exported = (entry.metas && typeof entry.metas.exported !== 'undefined'
                    ? entry.metas.exported
                    : !event);
  return exported;
}
Object.assign(e, {isExported});

export function isShared(schema, key) {
  const entry = schema[key];
  // share by default
  return (entry.metas && typeof entry.metas.shared !== 'undefined'
          ? entry.metas.shared
          : true);
}
Object.assign(e, {isShared});

export function isStored(schema, key) {
  const entry = schema[key];
  // do not store by default
  return (entry.metas && typeof entry.metas.stored !== 'undefined'
          ? entry.metas.stored
          : false);
}
Object.assign(e, {isStored});

export default e;
