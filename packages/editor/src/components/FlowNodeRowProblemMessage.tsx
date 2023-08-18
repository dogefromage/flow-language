import React, { PropsWithChildren } from 'react';
import { Bold } from '../styles/common';
import lang from '@fluss/language';

interface ProblemProps {
    problem: lang.RowProblem;
}

const FlowNodeRowProblemMessage = ({ problem }: PropsWithChildren<ProblemProps>) => {

    return (<>
        <Bold $color='#ff3463'>
            {problem.type}
        </Bold>
        <TypeSubProblem problem={problem} />
    </>);
}

export default FlowNodeRowProblemMessage;

const TypeSubProblem = ({ problem }: PropsWithChildren<ProblemProps>) => {
    if (problem.type !== 'incompatible-argument-type' &&
        problem.type !== 'invalid-value'
    ) return;

    return (
        <Bold $color='#ff3463'>
            {problem.typeProblem.message}
            {/* TODO format path */}
        </Bold>
    );
}