import * as lang from '@fluss/language';
import { whatChanged } from '@fluss/language/lib/esm/utils/whatChanged';
import { PropsWithChildren, useEffect, useRef } from 'react';
import { selectDocument, useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { validationSetResult } from '../slices/contextSlice';

interface ValidatorProps {

}

const Validator = ({}: PropsWithChildren<ValidatorProps>) => {
    const dispatch = useAppDispatch();
    const document = useAppSelector(selectDocument);

    useEffect(() => {
        try {
            const projectContext = lang.validateDocument(document);
            const projectContext2 = lang.validateDocument(document);

            const changes = whatChanged(projectContext, projectContext2, 1);
            if (changes) {
                console.log(changes);
            }
            
            dispatch(validationSetResult({
                context: projectContext,
            }));

        } catch (e) {
            console.error(e);
        }
    });

    return null;
}

export default Validator;