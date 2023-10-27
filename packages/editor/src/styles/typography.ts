import styled from "styled-components";

export const Bold = styled.span<{ $color: string }>`
    font-weight: bold;
    color: ${({ $color }) => $color};
`;
