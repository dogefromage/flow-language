import styled from 'styled-components';

export const FormSettingsGridDiv = styled.div`
    display: grid;
    grid-template-columns: 100px 1fr;
    grid-auto-rows: var(--list-height);
    align-items: center;
    grid-row-gap: var(--list-gap);
`;
