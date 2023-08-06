import { PropsWithChildren } from 'react';

interface DocumentStreamerProps {

}

// const init = _.memoize(() =>  {
//     const ydoc = new Y.Doc()
//     const ytext = ydoc.getText('project')

//     const provider = new WebrtcProvider('flow-typescript-test-room', ydoc, {
//         signaling: [ 'ws://localhost:4444' ],
//     });
//     console.log(provider);

//     return ytext;
// });

const DocumentStreamer = ({}: PropsWithChildren<DocumentStreamerProps>) => {
    // const content = useAppSelector(selectContent);
    // const [ text ] = useState(init);

    // useEffect(() => {
    //     const project = content.document;
    //     try {
    //         const data = JSON.stringify(project);
    //         text.delete(0, text.length);
    //         text.insert(0, data);
    //     } catch (e) {
    //         console.error(e);
    //     }
    // }, [content]);

    return null;
}

export default DocumentStreamer;