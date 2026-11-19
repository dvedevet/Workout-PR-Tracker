export function isDecimalInput(text, decimals) {
    return new RegExp(`^\\d*([.,]\\d{0,${decimals}})?$`).test(text)
}

export function parseDecimal(text) {
    if (text.trim() === "") return null
    const value = Number(text.replace(",", "."))
    return Number.isFinite(value) ? value : null
}
