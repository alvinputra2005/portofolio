import type {ContentKind} from "../cms/model";

// Visible management menus; other content types remain stored for the public portfolio.
export const adminMenuKinds=["profile","experience","project","achievement","credential"] as const satisfies readonly ContentKind[];
