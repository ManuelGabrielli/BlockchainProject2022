function decimalToHexString(number)
{
  if (number < 0)
  {
    number = 0xFFFFFFFF + number + 1;
  }

  return number.toString(16).toUpperCase();
}

/**
 * Should be called to pad string to expected length
 *
 * @method leftPad
 * @param {String} string to be padded
 * @param {Number} chars that result string should have
 * @param {String} sign, by default 0
 * @returns {String} right aligned string
 */
function leftPad(string, chars, sign) {
    string = string.toString(16).replace(/^0x/i, '');
    var padding = (chars - string.length + 1 >= 0) ? chars - string.length + 1 : 0;
    return '0x' + new Array(padding).join(sign ? sign : "0") + string;
};
