
import _ from 'lodash';
import { PropsWithChildren, useEffect, useState } from 'react';
import * as Y from 'yjs';
import { Provider, useSelector } from 'react-redux';
import { createStore } from './store';
import Plotter from './Plotter';

const App = () => {
    const [ store ] = useState(createStore);

    return (
        <Provider store={store}>
            <Plotter />
        </Provider>
    );
}

export default App;





const FlowDoc = () => {
    const [ value, setValue ] = useState('none');

    const document = useSelector((state: any) => state.document);

    useEffect(() => {
        try {
            setValue(JSON.stringify(document, null, 2));
        } catch (e) {

        }
    }, [ document ]);

    return (
        <pre>{ value }</pre>
    );
}



