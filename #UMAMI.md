# Umami tracking

Beyond Showrooms uses one Umami website. Log in at [cloud.umami.is](https://cloud.umami.is) and open that website. InsideFoshan is a separate Umami account.

Set the date range at the top of the dashboard before reading the numbers. A browser that has opened a `?noanalytics=1` link is not counted.

## Redirect pages (`v/`)

These pages do not stay open. They send the visitor to the homepage and add a campaign code. Umami does not list `/v/50K` under Pages. It lists the homepage, labeled with the campaign.

Current codes:

| Description link | Campaign code |
| --- | --- |
| `https://www.beyondshowrooms.com/v/50K` | `kimi-levi-50K` |
| `https://www.beyondshowrooms.com/v/ep1` | `ep1` |
| `https://www.beyondshowrooms.com/v/ep2` | `ep2` |
| `https://www.beyondshowrooms.com/v/ep3` | `ep3` |

`https://www.beyondshowrooms.com/v/` opens the homepage with no campaign. Those visits look like any other homepage visit.

**Where to look:** on the website overview, open **UTM** and then **Campaign**. Each code above is one redirect.

## Vlog landing pages (`vlog/`)

These are real pages. The visitor stays on the page, and the page includes the Umami script. No campaign code is used.

| Description link | Page in Umami |
| --- | --- |
| `https://beyondshowrooms.com/vlog/50K` | `/vlog/50K` |

**Where to look:** on the website overview, open **Pages**. The path is `/vlog/50K`.
