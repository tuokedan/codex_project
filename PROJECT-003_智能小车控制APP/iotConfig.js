/*
 * 小车 OneNET 配置。
 * 这里故意不复用电饭煲项目的凭据；请填入小车自己的参数。
 */
module.exports = {
	api: {
		query: 'https://iot-api.heclouds.com/thingmodel/query-device-property',
		set: 'https://iot-api.heclouds.com/thingmodel/set-device-property'
	},
	auth: {
		author_key: '',
		version: '2022-05-01',
		user_id: ''
	},
	device: {
		product_id: '',
		device_name: ''
	},
	propertyMap: {
		mode: 'mode',
		auto: 'auto',
		direction: 'direction',
		speed: 'speed'
	},
	values: {
		manualMode: 'manual',
		autoMode: 'auto',
		autoOn: true,
		autoOff: false,
		stop: 'stop',
		directions: {
			forward: 'forward',
			backward: 'backward',
			left: 'left',
			right: 'right'
		}
	}
}
