<template>
	<view class="page">
		<view class="hero">
			<view>
				<text class="eyebrow">SMART CAR</text>
				<text class="title">智能小车控制</text>
				<text class="subtitle">OneNET · ESP8266-01S</text>
			</view>
			<view :class="['status-dot', configured ? 'online' : 'offline']"></view>
		</view>

		<view class="status-card">
			<view>
				<text class="card-label">连接状态</text>
				<text class="connection-text">{{ configured ? (loading ? '同步中…' : '已配置，等待设备响应') : '请先配置 OneNET 参数' }}</text>
			</view>
			<text class="refresh" @click="fetchState">↻</text>
		</view>

		<view class="mode-tabs">
			<view :class="['mode-tab', mode === 'manual' ? 'active' : '']" @click="switchMode('manual')">手动模式</view>
			<view :class="['mode-tab', mode === 'auto' ? 'active' : '']" @click="switchMode('auto')">自动模式</view>
		</view>

		<view v-if="mode === 'manual'" class="panel">
			<view class="section-title">方向控制</view>
			<view class="direction-pad">
				<view></view>
				<button :class="['control-button', currentDirection === 'forward' ? 'selected' : '']" @click="sendDirection('forward')">↑<text>前进</text></button>
				<view></view>
				<button :class="['control-button', currentDirection === 'left' ? 'selected' : '']" @click="sendDirection('left')">←<text>左转</text></button>
				<button class="control-button stop" @click="stopCar">■<text>停止</text></button>
				<button :class="['control-button', currentDirection === 'right' ? 'selected' : '']" @click="sendDirection('right')">→<text>右转</text></button>
				<view></view>
				<button :class="['control-button', currentDirection === 'backward' ? 'selected' : '']" @click="sendDirection('backward')">↓<text>后退</text></button>
				<view></view>
			</view>

			<view class="section-title speed-title">速度档位</view>
			<view class="speed-row">
				<button v-for="speedItem in speeds" :key="speedItem" :class="['speed-button', speed === speedItem ? 'selected' : '']" @click="setSpeed(speedItem)">{{ speedItem }}档</button>
			</view>
		</view>

		<view v-else class="panel auto-panel">
			<view class="auto-icon">✦</view>
			<text class="auto-title">自动驾驶</text>
			<text class="auto-desc">开启后由小车程序自主执行自动行驶逻辑</text>
			<view :class="['auto-switch', autoEnabled ? 'enabled' : '']" @click="toggleAuto">
				<view class="switch-knob"></view>
			</view>
			<text :class="['auto-state', autoEnabled ? 'enabled-text' : '']">{{ autoEnabled ? '自动模式已开启' : '自动模式已关闭' }}</text>
		</view>

		<view class="footer-note">当前指令：{{ directionText }} · {{ speed }}档 · {{ mode === 'auto' ? (autoEnabled ? '自动开启' : '自动关闭') : '手动控制' }}</view>
	</view>
</template>

<script>
	const { createCommonToken } = require('@/key.js')
	const config = require('@/iotConfig.js')

	export default {
		data() {
			return {
				mode: 'manual',
				autoEnabled: false,
				currentDirection: 'stop',
				speed: 1,
				speeds: [1, 2, 3],
				token: '',
				loading: false,
				pollTimer: null
			}
		},
		computed: {
			configured() {
				return Boolean(config.auth.author_key && config.auth.user_id && config.device.product_id && config.device.device_name)
			},
			directionText() {
				return { stop: '停止', forward: '前进', backward: '后退', left: '左转', right: '右转' }[this.currentDirection] || '停止'
			}
		},
		onLoad() {
			if (this.configured) {
				this.token = createCommonToken(config.auth)
				this.fetchState()
			}
		},
		onShow() {
			if (this.configured) {
				this.pollTimer = setInterval(() => this.fetchState(), 5000)
			}
		},
		onHide() {
			this.clearPollTimer()
		},
		onUnload() {
			this.clearPollTimer()
		},
		methods: {
			clearPollTimer() {
				if (this.pollTimer) {
					clearInterval(this.pollTimer)
					this.pollTimer = null
				}
			},
			switchMode(nextMode) {
				if (this.mode === nextMode) return
				this.mode = nextMode
				const params = nextMode === 'auto'
					? this.makeParams({ mode: config.values.autoMode, auto: config.values.autoOff })
					: this.makeParams({ mode: config.values.manualMode, auto: config.values.autoOff, direction: config.values.stop })
				this.sendParams(params, nextMode === 'auto' ? '已切换到自动模式' : '已切换到手动模式')
			},
			sendDirection(direction) {
				if (this.mode !== 'manual') return
				this.currentDirection = direction
				this.sendParams(this.makeParams({
					mode: config.values.manualMode,
					auto: config.values.autoOff,
					direction: config.values.directions[direction],
					speed: this.speed
				}), this.directionText)
			},
			stopCar() {
				this.currentDirection = 'stop'
				this.sendParams(this.makeParams({ direction: config.values.stop }), '小车已停止')
			},
			setSpeed(nextSpeed) {
				this.speed = nextSpeed
				if (this.mode === 'manual') {
					this.sendParams(this.makeParams({ speed: nextSpeed }), `速度切换为${nextSpeed}档`)
				}
			},
			toggleAuto() {
				this.autoEnabled = !this.autoEnabled
				this.sendParams(this.makeParams({
					mode: config.values.autoMode,
					auto: this.autoEnabled ? config.values.autoOn : config.values.autoOff
				}), this.autoEnabled ? '自动模式已开启' : '自动模式已关闭')
			},
			makeParams(values) {
				const params = {}
				Object.keys(values).forEach((key) => {
					if (values[key] !== undefined && config.propertyMap[key]) params[config.propertyMap[key]] = values[key]
				})
				return params
			},
			sendParams(params, message) {
				if (!this.configured) {
					uni.showToast({ title: '请先填写 iotConfig.js', icon: 'none', duration: 2200 })
					return
				}
				this.loading = true
				uni.request({
					url: config.api.set,
					method: 'POST',
					data: {
						product_id: config.device.product_id,
						device_name: config.device.device_name,
						params
					},
					header: { authorization: this.token, 'Content-Type': 'application/json' },
					complete: () => { this.loading = false },
					success: (res) => {
						if (res.data && (res.data.code === 0 || res.data.code === 200)) {
							uni.showToast({ title: message, icon: 'success' })
						} else {
							uni.showToast({ title: '指令下发失败', icon: 'none' })
						}
					},
					fail: () => uni.showToast({ title: '网络请求失败', icon: 'none' })
				})
			},
			fetchState() {
				if (!this.configured || this.loading) return
				this.loading = true
				uni.request({
					url: config.api.query,
					method: 'GET',
					data: { product_id: config.device.product_id, device_name: config.device.device_name },
					header: { authorization: this.token },
					complete: () => { this.loading = false },
					success: (res) => this.applyState(res.data && res.data.data),
					fail: () => console.warn('OneNET 状态读取失败')
				})
			},
			applyState(items) {
				if (!Array.isArray(items)) return
				const state = {}
				items.forEach((item) => {
					const identifier = item.identifier || item.name
					if (identifier) state[identifier] = item.value
				})
				const map = config.propertyMap
				const remoteMode = state[map.mode]
				const remoteAuto = state[map.auto]
				if (remoteAuto !== undefined) this.autoEnabled = remoteAuto === true || remoteAuto === 'true' || remoteAuto === 1 || remoteAuto === '1'
				if (remoteMode !== undefined) this.mode = remoteMode === config.values.autoMode || remoteMode === 1 || remoteMode === '1' ? 'auto' : 'manual'
				if (state[map.direction] !== undefined) this.currentDirection = this.normalizeDirection(state[map.direction])
				if (state[map.speed] !== undefined) this.speed = Math.min(3, Math.max(1, Number(state[map.speed]) || 1))
			},
			normalizeDirection(value) {
				const values = config.values.directions
				return Object.keys(values).find((key) => values[key] === value) || (value === config.values.stop ? 'stop' : 'stop')
			}
		}
	}
</script>

<style scoped>
	.page { min-height: 100vh; padding: 34rpx 30rpx 42rpx; box-sizing: border-box; }
	.hero { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28rpx; }
	.eyebrow { display: block; color: #6d8aa5; font-size: 22rpx; letter-spacing: 5rpx; margin-bottom: 8rpx; }
	.title { display: block; color: #17293b; font-size: 46rpx; font-weight: 700; }
	.subtitle { display: block; color: #7a8b9b; font-size: 23rpx; margin-top: 10rpx; }
	.status-dot { width: 24rpx; height: 24rpx; border-radius: 50%; box-shadow: 0 0 0 10rpx rgba(24,166,115,.13); }
	.online { background: #18a673; }
	.offline { background: #f2a93b; }
	.status-card, .panel { background: #fff; border-radius: 26rpx; box-shadow: 0 10rpx 36rpx rgba(38,79,119,.08); }
	.status-card { padding: 25rpx 28rpx; display: flex; align-items: center; justify-content: space-between; margin-bottom: 26rpx; }
	.card-label { display: block; color: #8b99a7; font-size: 22rpx; margin-bottom: 8rpx; }
	.connection-text { color: #354858; font-size: 27rpx; }
	.refresh { color: #1976d2; font-size: 46rpx; padding: 0 10rpx; }
	.mode-tabs { display: flex; background: #dce8f2; border-radius: 18rpx; padding: 7rpx; margin-bottom: 26rpx; }
	.mode-tab { flex: 1; text-align: center; color: #678097; padding: 21rpx 0; border-radius: 14rpx; font-size: 29rpx; }
	.mode-tab.active { background: #1976d2; color: #fff; font-weight: 700; box-shadow: 0 8rpx 20rpx rgba(25,118,210,.25); }
	.panel { padding: 31rpx 27rpx 34rpx; }
	.section-title { color: #263b4d; font-size: 29rpx; font-weight: 700; margin-bottom: 28rpx; }
	.direction-pad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16rpx; align-items: center; justify-items: center; }
	.control-button { width: 142rpx; height: 112rpx; padding: 11rpx 0 7rpx; line-height: 42rpx; color: #4b657a; background: #edf4f9; border-radius: 20rpx; font-size: 42rpx; }
	.control-button text { display: block; font-size: 23rpx; line-height: 25rpx; }
	.control-button.selected { background: #1976d2; color: #fff; }
	.control-button.stop { background: #fff1f0; color: #e45858; }
	.speed-title { margin-top: 42rpx; }
	.speed-row { display: flex; gap: 18rpx; }
	.speed-button { flex: 1; color: #547088; background: #edf4f9; font-size: 27rpx; border-radius: 16rpx; padding: 18rpx 0; }
	.speed-button.selected { color: #fff; background: #18a673; }
	.auto-panel { min-height: 620rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
	.auto-icon { width: 124rpx; height: 124rpx; line-height: 124rpx; border-radius: 50%; background: #e6f1fb; color: #1976d2; font-size: 62rpx; margin-bottom: 25rpx; }
	.auto-title { font-size: 39rpx; font-weight: 700; color: #233b50; }
	.auto-desc { width: 500rpx; color: #8495a4; font-size: 24rpx; line-height: 1.5; margin-top: 17rpx; }
	.auto-switch { width: 148rpx; height: 78rpx; background: #cbd8e2; border-radius: 50rpx; margin-top: 45rpx; padding: 7rpx; box-sizing: border-box; transition: .2s; }
	.auto-switch.enabled { background: #18a673; }
	.switch-knob { width: 64rpx; height: 64rpx; background: #fff; border-radius: 50%; box-shadow: 0 4rpx 12rpx rgba(0,0,0,.15); transition: .2s; }
	.auto-switch.enabled .switch-knob { transform: translateX(70rpx); }
	.auto-state { margin-top: 23rpx; color: #8495a4; font-size: 26rpx; }
	.enabled-text { color: #18a673; font-weight: 700; }
	.footer-note { color: #7d8e9e; font-size: 22rpx; text-align: center; margin-top: 26rpx; }
</style>
