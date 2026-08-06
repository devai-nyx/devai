# Old-to-new round and batch map

| Source             | Source portion                                           | Destination  | Disposition                                                     |
| ------------------ | -------------------------------------------------------- | ------------ | --------------------------------------------------------------- |
| temporary Round 11 | B0–B4 CLI/executor law, reds, implementation, acceptance | R-0007 B0–B4 | retained and moved before former R-0007                         |
| temporary Round 11 | B5 user documentation + B6 documentation acceptance      | R-0009 B6–B7 | split from CLI implementation and merged with product/docs/site |
| temporary Round 11 | B7 audit/review + B8 close                               | R-0007 B6–B7 | retained for the reduced CLI/executor acceptance boundary       |
| temporary Round 12 | complete plan, matrix, benchmark, review, rollback       | R-0008       | renumbered; entry now explicitly follows new R-0007             |
| repository R-0007  | complete product/docs/site scope                         | R-0009       | merged with Round 11 documentation waves                        |
| repository R-0008  | repository and external release phases                   | R-0010       | renumbered; external grant stays pending                        |
| repository R-0009  | complete evidence-authorization preparation              | R-0011       | renumbered; clarified as distinct from convergence cache reuse  |
| repository R-0010  | complete observation/promotion campaign                  | R-0012       | renumbered; fresh mandate remains mandatory                     |

## Acceptance-boundary decisions

- R-0007 closes only CLI/executor behavior and its canonical generated reference data.
  It does not claim a complete user-facing documentation corpus.
- R-0008 has a separate acceptance boundary because a signature trust root, false-green
  adversaries, correctness-first benchmark, and capability rollback are independent risks.
- R-0009 closes all user-facing conceptual/reference/site work together, after both
  systems it explains have stabilized.
- R-0010 retains repository versus external phases rather than splitting them into two
  rounds, because the external transaction must remain bound to the exact prepared
  candidate and the round must remain visibly open while authorization is pending.
- R-0011 and R-0012 remain separate because preparation must not accidentally open or
  count the operational observation streak.
