#ifndef BCF_PROB1_H
#define BCF_PROB1_H

#include "bcf.h"

typedef struct {
	int n; // Number of samples
	int M; // Total number of chromosomes across all samples (n*2 if all samples are diploid)
	int n1;
	int is_indel;
	uint8_t *ploidy; // haploid or diploid ONLY
	double *q2p, *pdg; // q2p maps from phread scaled to real likelihood, pdg -> P(D|g)
	double *phi; // Probability of seeing k reference alleles
	double *phi_indel;
	double *z, *zswap; // aux for afs
	double *z1, *z2, *phi1, *phi2; // only calculated when n1 is set
	double **hg; // hypergeometric distribution
	double *lf; // log factorial
	double t, t1, t2;
	double *afs, *afs1; // afs: accumulative allele frequency spectrum (AFS); afs1: site posterior distribution
	const uint8_t *PL; // point to PL
	int PL_len;
    int cons_llr;       // pair and trio calling
    int64_t cons_gt;
} bcf_p1aux_t;

typedef struct {
	int rank0, perm_rank; // NB: perm_rank is always set to -1 by bcf_p1_cal()
	int ac; // ML alternative allele count
	double f_exp, f_flat, p_ref_folded, p_ref, p_var_folded, p_var;
	double cil, cih;
	double cmp[3], p_chi2, lrt; // used by contrast2()
} bcf_p1rst_t;

typedef struct {
    double p[4];
    double edb, mqb, bqb;   // end distance bias, mapQ bias, baseQ bias
    int mq, depth, is_tested, d[4];
} anno16_t;

#define MC_PTYPE_FULL  1
#define MC_PTYPE_COND2 2
#define MC_PTYPE_FLAT  3

#ifdef __cplusplus
extern "C" {
#endif

	bcf_p1aux_t *bcf_p1_init(int n_smpl, uint8_t *ploidy);
	void bcf_p1_init_prior(bcf_p1aux_t *ma, int type, double theta);
	void bcf_p1_init_subprior(bcf_p1aux_t *ma, int type, double theta);
	void bcf_p1_destroy(bcf_p1aux_t *ma);
    void bcf_p1_set_ploidy(bcf1_t *b, bcf_p1aux_t *ma);
	int bcf_p1_cal(const bcf1_t *b, int do_contrast, bcf_p1aux_t *ma, bcf_p1rst_t *rst);
    int call_multiallelic_gt(bcf1_t *b, bcf_p1aux_t *ma, double threshold, int var_only);
	int bcf_p1_call_gt(const bcf_p1aux_t *ma, double f0, int k);
	void bcf_p1_dump_afs(bcf_p1aux_t *ma);
	int bcf_p1_read_prior(bcf_p1aux_t *ma, const char *fn);
	int bcf_p1_set_n1(bcf_p1aux_t *b, int n1);
	void bcf_p1_set_folded(bcf_p1aux_t *p1a); // only effective when set_n1() is not called

	int bcf_em1(const bcf1_t *b, int n1, int flag, double x[10]);

#ifdef __cplusplus
}
#endif

#endif
