{{- /*
Tetratecommons deployment template
*/ -}}
{{- define "km.deployment" -}}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .serviceName }}
  namespace: {{ include "km.namespace" . }}
  labels:
    app: {{ .serviceName }}
    {{- include "km.labels" . | nindent 4 }}
spec:
  replicas: {{ .replicas }}
  selector:
    matchLabels:
      app: {{ .serviceName }}
  template:
    metadata:
      labels:
        app: {{ .serviceName }}
        version: {{ .version | default "v1" }}
    spec:
      serviceAccountName: {{ .serviceAccount | default "km-service-account" }}
      containers:
        - name: {{ .serviceName }}
          image: "{{ .image }}"
          ports:
            - containerPort: 8080
              name: http
          env:
            - name: NODE_ENV
              value: "production"
            {{- if .env }}
            {{- range $key, $value := .env }}
            - name: {{ $key }}
              {{- if kindIs "map" $value }}
              valueFrom: {{ $value | toJson }}
              {{- else }}
              value: {{ $value | quote }}
              {{- end }}
            {{- end }}
            {{- end }}
          resources:
            requests:
              memory: {{ .resources.requests.memory | default "256Mi" }}
              cpu: {{ .resources.requests.cpu | default "250m" }}
            limits:
              memory: {{ .resources.limits.memory | default "512Mi" }}
              cpu: {{ .resources.limits.cpu | default "500m" }}
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 15
            timeoutSeconds: 3
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
            timeoutSeconds: 3
            failureThreshold: 3
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: {{ .serviceName }}
                topologyKey: topology.kubernetes.io/zone
{{- end -}}

{{- define "km.service" -}}
apiVersion: v1
kind: Service
metadata:
  name: {{ .serviceName }}
  namespace: {{ include "km.namespace" . }}
spec:
  selector:
    app: {{ .serviceName }}
  ports:
    - name: http
      port: {{ .port | default 80 }}
      targetPort: 8080
  type: ClusterIP
{{- end -}}

{{- define "km.hpa" -}}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ .serviceName }}-hpa
  namespace: {{ include "km.namespace" . }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ .serviceName }}
  minReplicas: {{ .minReplicas }}
  maxReplicas: {{ .maxReplicas }}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .targetCPU | default 70 }}
{{- end -}}

{{- define "km.pdb" -}}
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: {{ .serviceName }}-pdb
  namespace: {{ include "km.namespace" . }}
spec:
  minAvailable: {{ .minAvailable | default 1 }}
  selector:
    matchLabels:
      app: {{ .serviceName }}
{{- end -}}