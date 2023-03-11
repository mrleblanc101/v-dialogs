export const [CN, EN, PT, JP] = ['cn', 'en', 'pt', 'jp']

const languages = {
  [CN]: {
    titleInfo: '提示',
    titleWarning: '警告',
    titleError: '错误',
    titleSuccess: '成功',
    titleConfirm: '确认',
    btnOk: '确认',
    btnCancel: '取消',
    maskText: '数据加载中……'
  },
  [EN]: {
    titleInfo: 'Information',
    titleWarning: 'Warning',
    titleError: 'Error',
    titleSuccess: 'Success',
    titleConfirm: 'Confirmation',
    btnOk: 'OK',
    btnCancel: 'Cancel',
    maskText: 'Loading……'
  },
  [PT]: {
    titleInfo: 'Aviso',
    titleWarning: 'Alerta',
    titleError: 'Erro',
    titleSuccess: 'Sucesso',
    titleConfirm: 'Confirmaço',
    btnOk: 'OK',
    btnCancel: 'Cancelar',
    maskText: 'Carregando……'
  },
  [JP]: {
    titleInfo: 'ヒント',
    titleWarning: '警告',
    titleError: '間違った',
    titleSuccess: '成功',
    titleConfirm: '確認',
    btnOk: '確認',
    btnCancel: 'キャンセル',
    maskText: 'データロード……'
  }
}

/**
 * Get language resource by language code
 * @param {string} code - language code
 * @returns {object} language resource
 */
export function getLanguage (code = CN) {
  return languages[code]
}

export default languages
