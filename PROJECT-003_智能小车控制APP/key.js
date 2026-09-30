const crypto = require('crypto')

function createCommonToken(params) {
	const accessKey = Buffer.from(params.author_key, 'base64')
	const version = params.version
	const resource = 'userid/' + params.user_id
	const expireAt = Math.ceil((Date.now() + 365 * 24 * 3600 * 1000) / 1000)
	const method = 'sha1'
	const signText = expireAt + '\n' + method + '\n' + resource + '\n' + version
	const sign = crypto.createHmac('sha1', accessKey).update(signText).digest().toString('base64')

	return `version=${version}&res=${encodeURIComponent(resource)}&et=${expireAt}&method=${method}&sign=${encodeURIComponent(sign)}`
}

module.exports = {
	createCommonToken
}
