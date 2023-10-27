import { EditorConfig } from ".";

export interface ContentSliceState extends Pick<EditorConfig, 
    | 'commands' 
    | 'toolbarInlineMenuComponents'
    | 'toolbarWidgetComponents' 
    | 'managerComponents'
> {
    
}