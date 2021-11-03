/// <reference types="node" />
import { Readable } from 'stream';
import { Task } from '../managers/tasks';
import ReaderStream from '../readers/stream';
import { EntryItem, ReaderOptions } from '../types';
import Provider from './provider';
export default class ProviderAsync extends Provider<Promise<EntryItem[]>> {
    protected _reader: ReaderStream;
    read(task: Task): Promise<EntryItem[]>;
    api(root: string, task: Task, options: ReaderOptions): Readable;
}
