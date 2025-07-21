export interface IGetServiceDiscoveryInstanceResult {
	Node: Node;
	Service: Service;
	Checks: Check[];
}

export interface Node {
	ID: string;
	Node: string;
	Address: string;
	Datacenter: string;
	TaggedAddresses: TaggedAddresses;
	Meta: Meta;
	CreateIndex: number;
	ModifyIndex: number;
}

export interface TaggedAddresses {
	lan: string;
	lan_ipv4: string;
	wan: string;
	wan_ipv4: string;
}

export interface Meta {
	'consul-network-segment': string;
	'consul-version': string;
}

export interface Service {
	ID: string;
	Service: string;
	Tags: any[];
	Address: string;
	Meta: any;
	Port: number;
	Weights: Weights;
	EnableTagOverride: boolean;
	Proxy: Proxy;
	Connect: Connect;
	PeerName: string;
	CreateIndex: number;
	ModifyIndex: number;
}

export interface Weights {
	Passing: number;
	Warning: number;
}

export interface Proxy {
	Mode: string;
	MeshGateway: MeshGateway;
	Expose: Expose;
}

export interface MeshGateway {}

export interface Expose {}

export interface Connect {}

export interface Check {
	Node: string;
	CheckID: string;
	Name: string;
	Status: string;
	Notes: string;
	Output: string;
	ServiceID: string;
	ServiceName: string;
	ServiceTags: any[];
	Type: string;
	Interval: string;
	Timeout: string;
	ExposedPort: number;
	Definition: Definition;
	CreateIndex: number;
	ModifyIndex: number;
}

export interface Definition {}
