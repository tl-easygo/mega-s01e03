// Which problems a merged ticket really holds. causes.ts sorts by tenant and channel, the desk's
// own view; this adds what the desk saw when it read the body (desk-notes.json): reports read as a
// one-day move are their own problem too. They stay counted under their cause, as the desk counts.
import { groupByCause, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';

// `shift`: the date lands one day early or late, not with day and month swapped. A different bug:
// the day moves with the reader's timezone, not with the tenant's date order.
export type Problem = Cause | 'shift' | 'unplaced';

export type ProblemGroup = { problem: Problem; reports: Report[]; tenants: number; firstSeen: string; lastSeen: string };

function group(problem: Problem, rs: Report[]): ProblemGroup {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return { problem, reports: rs, tenants: new Set(rs.map((r) => r.tenant)).size, firstSeen: days[0], lastSeen: days[days.length - 1] };
}

export function groupByProblem(
  reports: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  shifted: readonly string[],
): ProblemGroup[] {
  const merged = uniqueById(reports).filter((r) => r.mergedInto === ticket);
  const byCause = groupByCause(merged, tenantOf).map((g) => group(g.cause, g.reports));
  const shift = merged.filter((r) => shifted.includes(r.id));
  return shift.length ? [...byCause, group('shift', shift)] : byCause;
}
