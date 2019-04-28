import camelCase from 'lodash.camelcase'

const vendors = ['webkit', 'moz', 'ms', 'o']
const vendorsPrefixesRegexps = vendors.map(vendor => RegExp(`^(\-${vendor}\-|${vendor}_)`)) // for example /^(\-webkit\-|webkit_)/

const isVendorCssProps = (cssProp) => {
  const lowerCased = cssProp.toLowerCase()
  return vendorsPrefixesRegexps.some(regex => regex.test(lowerCased))
}

export const toReactCssCase = (string) => {
  const camelCased = camelCase(string)

  if (isVendorCssProps(string)) return camelCased.charAt(0).toUpperCase() + camelCased.slice(1)

  return camelCased
}
