

export function maybe<T>(t: T) {
    return t as T | undefined;
}

export function interlace<T>(arr: T[], spacer: T) {
    const newArr: T[] = [];
    for (let i = 0; i < arr.length; i++) {
        if (i > 0) {
            newArr.push(spacer);
        }
        newArr.push(arr[i]);
    }
    return newArr;
}
