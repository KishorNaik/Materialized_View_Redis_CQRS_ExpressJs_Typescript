import Pusher from 'pusher';
import { PubSubMessagePusher } from '../../../../types';

export class PubSubProducerPusher {
	private pusher: Pusher;
	private channelName: string;
	private eventName: string;

	constructor(
		private appKey: string,
		private appId: string,
		private cluster: string,
		private secret: string,
		channelName: string,
		eventName: string
	) {
		this.pusher = new Pusher({
			appId: this.appId,
			key: this.appKey,
			secret: this.secret,
			cluster: this.cluster,
			useTLS: true,
		});
		this.channelName = channelName;
		this.eventName = eventName;
	}

	public async publishMessageAsync<T>(
		message: PubSubMessagePusher<T>
	): Promise<Pusher.Response | undefined | null> {
		let response: Pusher.Response | undefined | null;
		try {
			for (let attempt = 0; attempt < 3; attempt++) {
				try {
					response = await this.pusher.trigger(this.channelName, this.eventName, message);
					console.log(
						`Published message correlationId ${message?.correlationId}: channel ${this.channelName}, event ${this.eventName}`
					);
					break;
				} catch (ex) {
					console.error(`[PubSubProducer] Attempt ${attempt + 1} failed:`, ex);
					if (attempt === 2) throw ex;
				}
			}
			return response;
		} catch (ex) {
			throw ex;
		}
	}
}
