function convertRomanianSpecialChars(str) {
    const replacements = {
        'ă': 'a',
        'â': 'a',
        'î': 'i',
        'ș': 's',
        'ț': 't',
        'Ă': 'A',
        'Â': 'A',
        'Î': 'I',
        'Ș': 'S',
        'Ț': 'T',
    };

    let result = '';

    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        result += replacements[char] || char; // Replace or keep the original character
    }

    return result;
}

module.exports = convertRomanianSpecialChars