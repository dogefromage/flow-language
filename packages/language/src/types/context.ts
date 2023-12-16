import { GenericNamingContext, TExpr } from '../typesystem/typeExpr';
import { assert } from '../utils';
import { Environment, FunctionSignature } from './env';
import { Obj } from './internal';
import { FlowDocument } from './grammar';

export type ReferenceStatus = 'normal' | 'redundant' | 'cyclic' | 'illegal';
export type ReferenceSyntacticType = 'value-and-type' | 'type-only';

export interface ReferenceContext {
    kind: 'reference';
    problems: ValidationProblem[];
    // status: ReferenceStatus;
}

export interface ValidationProblem {
    message: string;
    // maybe add severity here
}

export interface RowContext {
    problems: ValidationProblem[];
    type: TExpr | null;
}

export interface CallNodeContext {
    kind: 'call';
    problems: ValidationProblem[];
    inputRows: Obj<RowContext>;
    outputType: TExpr | null;
    signature: FunctionSignature | null;
    // isUsed: boolean;
}
export interface FunctionNodeContext {
    kind: 'function';
    signature: FunctionSignature;
    problems: ValidationProblem[];
    result: RowContext;
    // functionType: TExpr | null;
    // isUsed: boolean;
}

export type NodeContext = CallNodeContext | FunctionNodeContext;

export interface FlowGraphContext {
    problems: ValidationProblem[];
    nodes: Obj<NodeContext>;
    env: Environment;
    namingContext: GenericNamingContext;
    references: Obj<ReferenceContext>;
}

export interface DocumentContext {
    problems: ValidationProblem[];
    flowContexts: Obj<FlowGraphContext>;
}


export type LanguageValidator = (document: FlowDocument) => DocumentContext;

type MaybeProblemState<T> = 
    | { kind: 'ok', result: T } 
    | { kind: 'problem', problem: ValidationProblem }

export class MaybeProblem<T> {
    private constructor(
        private state: MaybeProblemState<T>,
    ) {}

    static ok<T>(result: T): MaybeProblem<T> {
        return new MaybeProblem({ kind: 'ok', result });
    }
    static problem<T>(problem: ValidationProblem): MaybeProblem<T> {
        return new MaybeProblem({ kind: 'problem', problem });
    }

    cast<R>() {
        return this as any as MaybeProblem<R>;
    }

    flatMap<R>(fn: (t: T) => MaybeProblem<R>): MaybeProblem<R> {
        if (this.state.kind === 'ok') {
            return fn(this.state.result);
        }
        return this.cast<R>();
    }
    map<R>(fn: (t: T) => R): MaybeProblem<R> {
        if (this.state.kind === 'ok') {
            return MaybeProblem.ok(fn(this.state.result));
        }
        return this.cast<R>();
    }
    mapProblem(fn: (p: ValidationProblem) => ValidationProblem): MaybeProblem<T> {
        if (this.state.kind === 'problem') {
            return MaybeProblem.problem(fn(this.state.problem));
        }
        return this;
    }

    kind() {
        return this.state.kind;
    }
    result(): T {
        const s = this.state;
        if (s.kind === 'problem') {
            throw new Error(`Unwrapped problem: ${s.problem.message}`);
        }
        return s.result;
    }
    problem() {
        const s = this.state;
        assert(s.kind === 'problem', `Maybe state is not problem.`);
        return s.problem;
    }
}
