import Pusher from 'pusher-js';
import { PubSubMessagePusher } from '../../../../types';

export enum isAuthEnabledEnum {
	TRUE = 1,
	FALSE = 0,
}

export class PubSubConsumerPusher {
	private pusher: Pusher;
	private channelName: string;
	private eventName: string;

	constructor(
		private appKey: string,
		private cluster: string,
		private isAuthEnabled: isAuthEnabledEnum,
		private authEndpoint: string | undefined = undefined,
		channelName: string,
		eventName: string
	) {
		if (isAuthEnabled === isAuthEnabledEnum.TRUE) {
			this.pusher = new Pusher(appKey, {
				cluster: cluster,
				forceTLS: true,
				channelAuthorization: {
					endpoint: authEndpoint!,
					transport: 'ajax',
				},
			});
		} else {
			this.pusher = new Pusher(appKey, {
				cluster: cluster,
				forceTLS: true,
			});
		}
		this.channelName = channelName;
		this.eventName = eventName;
	}

	public async subscribeMessageAsync<T>(
		onMessage: (msg: PubSubMessagePusher<T>) => Promise<void>
	): Promise<void> {
		try {
			const channel = this.pusher.subscribe(this.channelName);
			await channel.bind(this.eventName, async (data: PubSubMessagePusher<T>) => {
				for (let attempt = 0; attempt < 3; attempt++) {
					try {
						await onMessage(data);
						break;
					} catch (error) {
						console.error(`[PubSubConsumer] Attempt ${attempt + 1} failed:`, error);
						if (attempt === 2) throw error;
					}
				}
			});
		} catch (ex) {
			throw ex;
		}
	}
}
