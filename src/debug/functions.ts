export function Object2String(data: object) {
    let result = ''

    for (let key in data) {
        result += `${key}: ${data[key] === null || data[key] === undefined ? 'null/undefined' : typeof data[key] === 'object' ? Object2String(data[key]) : data[key]}\n`
    }

    return result
}
