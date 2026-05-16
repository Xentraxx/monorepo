package registry

import "strings"

func normalizeMapCountry(country string) string {
	country = strings.TrimSpace(country)
	if len(country) != 2 {
		return ""
	}

	for _, ch := range country {
		if (ch < 'A' || ch > 'Z') && (ch < 'a' || ch > 'z') {
			return ""
		}
	}

	return strings.ToUpper(country)
}
