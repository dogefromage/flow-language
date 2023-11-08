import styled, { css } from "styled-components";

export const Bold = styled.span<{ $color: string }>`
    font-weight: bold;
    color: ${({ $color }) => $color};
`;

export const ELLIPSIS_STYLES = css`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;