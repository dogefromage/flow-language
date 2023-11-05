import { expose } from 'comlink';
import { ClientSideProcess } from './ClientSideProcess';

const process = new ClientSideProcess();

expose(process);

