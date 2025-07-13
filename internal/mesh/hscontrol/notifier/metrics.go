package notifier

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"tailscale.com/envknob"
)

const prometheusNamespace = "headscale"

var debugHighCardinalityMetrics = envknob.Bool("HEADSCALE_DEBUG_HIGH_CARDINALITY_METRICS")

var notifierUpdateSent *prometheus.CounterVec

func init() {
	if debugHighCardinalityMetrics {
		notifierUpdateSent = promauto.NewCounterVec(prometheus.CounterOpts{
			Namespace: prometheusNamespace,
			Name:      "notifier_update_sent_total",
			Help:      "total count of update sent on nodes channel",
		}, []string{"status", "type", "trigger", "id"})
	} else {
		notifierUpdateSent = promauto.NewCounterVec(prometheus.CounterOpts{
			Namespace: prometheusNamespace,
			Name:      "notifier_update_sent_total",
			Help:      "total count of update sent on nodes channel",
		}, []string{"status", "type", "trigger"})
	}
}

var (
	notifierWaitersForLock = promauto.NewGaugeVec(prometheus.GaugeOpts{
		Namespace: prometheusNamespace,
		Name:      "notifier_waiters_for_lock",
		Help:      "gauge of waiters for the notifier lock",
	}, []string{"type", "action"})
	notifierWaitForLock = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Namespace: prometheusNamespace,
		Name:      "notifier_wait_for_lock_seconds",
		Help:      "histogram of time spent waiting for the notifier lock",
		Buckets:   []float64{0.001, 0.01, 0.1, 0.3, 0.5, 1, 3, 5, 10},
	}, []string{"action"})
	notifierUpdateReceived = promauto.NewCounterVec(prometheus.CounterOpts{
		Namespace: prometheusNamespace,
		Name:      "notifier_update_received_total",
		Help:      "total count of updates received by notifier",
	}, []string{"type", "trigger"})
	notifierNodeUpdateChans = promauto.NewGauge(prometheus.GaugeOpts{
		Namespace: prometheusNamespace,
		Name:      "notifier_open_channels_total",
		Help:      "total count open channels in notifier",
	})
	notifierBatcherWaitersForLock = promauto.NewGaugeVec(prometheus.GaugeOpts{
		Namespace: prometheusNamespace,
		Name:      "notifier_batcher_waiters_for_lock",
		Help:      "gauge of waiters for the notifier batcher lock",
	}, []string{"type", "action"})
	notifierBatcherChanges = promauto.NewGaugeVec(prometheus.GaugeOpts{
		Namespace: prometheusNamespace,
		Name:      "notifier_batcher_changes_pending",
		Help:      "gauge of full changes pending in the notifier batcher",
	}, []string{})
	notifierBatcherPatches = promauto.NewGaugeVec(prometheus.GaugeOpts{
		Namespace: prometheusNamespace,
		Name:      "notifier_batcher_patches_pending",
		Help:      "gauge of patches pending in the notifier batcher",
	}, []string{})
)
