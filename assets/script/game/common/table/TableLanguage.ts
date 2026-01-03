
import { JsonUtil } from "db://oops-framework/core/utils/JsonUtil";

export class TableLanguage {
    static TableName: string = "Language";

    private data: any;

    init(id: string) {
        var table = JsonUtil.get(TableLanguage.TableName);
        this.data = table[id];
        this.id = id;
    }

    /** 编号【KEY】 */    id: string = null!;

    /** 简体中文 */
    get zh(): string {
        return this.data.zh;
    }
    /** 英文 */
    get en(): string {
        return this.data.en;
    }
}
    