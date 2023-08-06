import * as lang from '@fluss/language';
import { PropsWithChildren, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, XAxis, YAxis } from 'recharts';
import { useDebouncedValue } from './useDebouncedValue';

interface PlotterProps {

}

type Point = { x: number, y: number };

const RANGE = 5;
const STEP = 0.1;

const Plotter = ({}: PropsWithChildren<PlotterProps>) => {
    const [data, setData] = useState<Array<{ x: number, y: number }>>([]);
    const [error, setError] = useState<string>('');

    // const document = useSelector((state: any) => state.document as lang.FlowDocument);

    const document = useDebouncedValue(
        useSelector((state: any) => state.document as lang.FlowDocument),
        20,
    )

    useEffect(() => {
        if (!document) return;

        let context: lang.DocumentContext | undefined;
        try {
            context = lang.validateDocument(document);
        } catch (e) {
            // console.error(e);
        }
        if (!context) return;

        try {
            const newData: Point[] = [];

            for (let x = -RANGE; x <= RANGE; x += STEP) {
                const result = lang.interpretDocument(context, { args: { x }});
                newData.push({ x, y: result.returnValue.y as number });
            }
            setError('');
            setData(newData);
        } catch (e) {
            setError(e.message);
        }

    }, [document]);

    return (<>
        <h1>Plot</h1>
        <h2 style={{ color: 'red' }}>{error}</h2>
        <ResponsiveContainer width="100%" height={700}>
            <ScatterChart
                margin={{
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20,
                }}
            >
                <CartesianGrid />
                <XAxis type="number" dataKey="x" domain={[-RANGE, RANGE]} allowDataOverflow />
                <YAxis type="number" dataKey="y" domain={[-RANGE, RANGE]} allowDataOverflow />
                <Scatter name="Curve" data={data} fill="#8884d8" line animationDuration={0} />
            </ScatterChart>
        </ResponsiveContainer>
    </>);
}

export default Plotter;