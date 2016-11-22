// CPS trim prefix the padding zero which expects to be supplied to BOSS
// expect trsnalte the prefix into a 10 digit number
// e.g offnet_incoming_call_prefix, (e.g from 246000 to 0000246000)
// e.g offnet_outgoing_call_prefix, (e.g from +00246001 to 0000246001)
export function translateTo10DigitOffnetPrefix(offnetPrefix) {
  const prefixString = `000000000${parseInt(offnetPrefix, 10)}`;
  return prefixString.substr(prefixString.length - 10);
}
