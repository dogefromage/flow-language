import styled from "styled-components";

export const FormSettingsTable = styled.div`
    display: grid;
    grid-template-columns: 120px 1fr;
    /* grid-auto-rows: var(--list-height); */
    /* align-items: center; */
    grid-row-gap: var(--list-gap);

    @container (max-width: 300px) {
        grid-template-columns: 1fr;
    }
`;

export const FormSpacer = styled.div`
    border-bottom: 1px solid var(--color-2);
    height: 0;
`;
