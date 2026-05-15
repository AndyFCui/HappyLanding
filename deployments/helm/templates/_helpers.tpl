{{- /*
Tetratecommons helper template library
*/ -}}
{{- define "km.labels" -}}
app.kubernetes.io/name: {{ include "km.name" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end -}}

{{- define "km.name" -}}
{{- $name := default .Chart.Name .Values.global.nameOverride -}}
{{- if and .Values.global.fullnameOverride (not .Values.global.nameOverride) -}}
{{- .Values.global.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{- define "km.selectorLabels" -}}
app: {{ include "km.name" . }}
{{- end -}}

{{- define "km.fullname" -}}
{{- include "km.name" . -}}
{{- end -}}

{{- define "km.namespace" -}}
{{- .Values.global.namespace | default "km-system" -}}
{{- end -}}