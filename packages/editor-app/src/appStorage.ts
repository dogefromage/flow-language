

// export type EditorStorageResponse<D> = {
//     data: D;
//     error?: { message: string };
// }

// export abstract class EditorStorage extends Emittery<{
//     reset: never;
// }> {
//     abstract loadInitial():
//         Promise<EditorStorageResponse<{ file: ProjectFile | null }>>;

//     /**
//      *  Returns data at file path if existent (eg. for opening last opened project), can return error message
//      */
//     abstract load(path: ProjectFileLocation):
//         Promise<EditorStorageResponse<{ file: ProjectFile | null }>>;

//     /**
//      *  returns new file path if successful otherwise null and error msg
//      */
//     abstract saveNewLocation(data: ProjectFileData): 
//         Promise<EditorStorageResponse<{ file: ProjectFile | null }>>;

//     /**
//      *  saves, can return error message
//      */
//     abstract save(path: ProjectFileLocation, data: ProjectFileData): 
//         Promise<EditorStorageResponse<{ success: boolean }>>;
// }

// export type ProjectStorageStatus = 
//     | { type: 'okay',    icon?: string, msg?: string }
//     | { type: 'loading', icon?: string, msg?: string }
//     | { type: 'error',   icon?: string, msg?: string }







// export class AppEditorStorage extends EditorStorage {

//     private projectIdFromUrl: string | null;

//     constructor() {
//         super();
//         this.projectIdFromUrl = new URL(window.location.toString())
//             .searchParams
//             .get('projectId');
//     }

//     async loadInitial() {
//         // load if has url arg
//         if (this.projectIdFromUrl == null) {
//             return {
//                 data: { file: null },
//             };
//         }
//         return this.load({ channel: 'cloud', projectId: this.projectIdFromUrl });
//     }

//     async load(path: ProjectFileLocation) {
//         assertTruthy(path.channel === 'cloud', 'Can only fetch from cloud.');

//         const file = await this.loadFromDatabase(path.projectId);
//         if (!file) {
//             return {
//                 data: { file: null },
//                 error: {
//                     message: `Error fetching project (projectId=${this.projectIdFromUrl}) from database.`
//                 }
//             };
//         }
//         return {
//             data: { file }
//         };
//     }

//     saveNewLocation(data: ProjectFileData): Promise<EditorStorageResponse<{ file: ProjectFilePair | null; }>> {
//         throw new Error('Method not implemented.');
//     }
//     save(path: ProjectFileLocation, data: ProjectFileData): Promise<EditorStorageResponse<{ success: boolean; }>> {
//         throw new Error('Method not implemented.');
//     }

//     async loadFromDatabase(projectId: string) {

//         const [{ data, error }, session] =
//             await Promise.all([
//                 selectProjectById(projectId),
//                 supabase.auth.getSession(),
//             ]);

//         if (error) {
//             console.error(error);
//         }
//         if (data == null) {
//             return null;
//         }

//         const author = takeSingle(data.author);
//         const username = author.username || '[Deleted]';

//         const isReadonly = session.data.session?.user.id !== author.id;

//         const filePair: ProjectFile = {
//             location: {
//                 channel: `cloud@${username}`,
//                 projectId: data.id,
//             },
//             data: {
//                 name: data.title!,
//                 documentJson: data.project_data,
//                 readonly: isReadonly,
//             }
//         };
//         return filePair;
//     }
// }
