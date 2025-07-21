import Consul from 'consul';
import { DeregisterOptions, RegisterOptions } from 'consul/lib/agent/service.js';
import { IGetServiceDiscoveryInstanceResult } from './types';

export interface IConsulOptions {
	host?: string;
	port?: number;
	secure?: boolean;
	defaults?: {
		dc?: string;
		partition?: string;
		wan?: boolean;
		consistent?: boolean;
		stale?: boolean;
		index?: string;
		wait?: string;
		near?: string;
		filter?: string;
		token?: string;
	};
}

export const consulInstance = (options: IConsulOptions) => {
	const consul = new Consul({
		host: process.env.CONSUL_HOST || options.host || 'localhost',
		port: parseInt(process.env.CONSUL_PORT!) || options.port || 8500,
	});

	return consul;
};

export interface IRegisterServiceDiscoveryParameters {
	consul: Consul;
	configuration: RegisterOptions;
}

export const registerServiceDiscoveryAsync = async (
	options: IRegisterServiceDiscoveryParameters
) => {
	try {
		return await options.consul.agent.service.register(options.configuration);
	} catch (ex) {
		throw ex;
	}
};

export interface IDeregisterServiceDiscoveryParameters {
	consul: Consul;
	configuration: DeregisterOptions;
}

export const deregisterServiceDiscoveryAsync = async (
	options: IDeregisterServiceDiscoveryParameters
) => {
	try {
		return await options.consul.agent.service.deregister(options.configuration);
	} catch (ex) {
		throw ex;
	}
};

export interface IGetServiceDiscoveryInstanceParameters {
	consul: Consul;
	serviceName: string;
}

export const getServiceDiscoveryInstance = async (
	params: IGetServiceDiscoveryInstanceParameters
): Promise<IGetServiceDiscoveryInstanceResult | null> => {
	try {
		const services: unknown[] = await params.consul.health.service({
			service: params.serviceName,
			passing: true,
		});
		if (services.length > 0) {
			// Simple round-robin or random selection for demo.
			// In production, consider more sophisticated load balancing strategies.
			const instance = services[
				Math.floor(Math.random() * services.length)
			] as IGetServiceDiscoveryInstanceResult;
			//console.log(`Discovered instance for ${serviceName}: ${instance.Address}:${instance.Port}`);
			return instance;
		}
		return null;
	} catch (err) {
		//console.error(`Error querying Consul for ${serviceName}:`, err);
		return null;
	}
};
