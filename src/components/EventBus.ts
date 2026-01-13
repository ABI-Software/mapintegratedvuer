import mitt from 'mitt';
import type { SimulationRequest, SimulationResponse } from '../types/simulation';

// Define the mapping of Event Name -> Event Payload
type Events = {
  'simulation-request': SimulationRequest;
  'simulation-data-ready': SimulationResponse; // If you use the relay pattern later
  [key: string]: any; // Allow for other events with any payload.
};

// Pass the type to mitt
const EventBus = mitt<Events>();
export default EventBus;
