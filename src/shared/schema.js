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
  const exported = (entry.metas && typeof entry.metas.exported !== 'undefined'
                    ? schema[key].metas.exported
                    : !event);
  return exported;
}
Object.assign(e, {isExported});

export function isShared(schema, key) {
  const entry = schema[key];
  return (entry.metas && typeof entry.metas.shared !== 'undefined'
          ? schema[key].metas.shared
          : true);
}
Object.assign(e, {isShared});

export default e;
