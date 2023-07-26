import { JointLocation } from "@fluss/language";
import { JointLocationKey } from "../types";

export function getJointLocationKey(location: JointLocation): JointLocationKey {
    let key: JointLocationKey = `${location.nodeId}.${location.rowId}`;
    if (location.direction === 'input') {
        key = `${key}.${location.jointIndex}`;
    }
    return key;
}