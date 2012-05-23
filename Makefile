SUBDIRS = yavdrweb-ng utils scripts
.PHONY: $(SUBDIRS)

ALL = $(addsuffix -all,$(SUBDIRS))
INSTALL = $(addsuffix -install,$(SUBDIRS))
CLEAN = $(addsuffix -clean,$(SUBDIRS))

all: $(ALL)
install: $(INSTALL)
clean: $(CLEAN)

$(ALL):
	$(MAKE) -C $(@:-all=) all

$(INSTALL):
	$(MAKE) -C $(@:-install=) install
	mkdir -p $(DESTDIR)/usr/share/yavdr
	for f in events templates; do \
	  cp -pr $$f $(DESTDIR)/usr/share/yavdr; done
	chmod +x $(DESTDIR)/usr/share/yavdr/events/actions/*

$(CLEAN):
	$(MAKE) -C $(@:-clean=) clean

